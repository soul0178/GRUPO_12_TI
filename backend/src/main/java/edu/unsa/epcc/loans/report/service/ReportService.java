package edu.unsa.epcc.loans.report.service;

import edu.unsa.epcc.loans.common.dto.PageResponse;
import edu.unsa.epcc.loans.common.exception.BusinessException;
import edu.unsa.epcc.loans.inventory.dto.ItemResponse;
import edu.unsa.epcc.loans.inventory.service.ItemService;
import edu.unsa.epcc.loans.loan.dto.LoanResponse;
import edu.unsa.epcc.loans.loan.entity.LoanStatus;
import edu.unsa.epcc.loans.loan.mapper.LoanMapper;
import edu.unsa.epcc.loans.loan.repository.LoanHistoryCounts;
import edu.unsa.epcc.loans.loan.repository.LoanRepository;
import edu.unsa.epcc.loans.report.dto.LoanHistoryReport;
import edu.unsa.epcc.loans.report.dto.LoanHistorySummary;
import edu.unsa.epcc.loans.report.dto.ReportSubject;
import edu.unsa.epcc.loans.user.dto.UserResponse;
import edu.unsa.epcc.loans.user.service.UserService;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Reportes de solo lectura sobre los préstamos: historial por usuario y por ítem (M6). */
@Service
@RequiredArgsConstructor
public class ReportService {

    private static final ZoneId LIMA = ZoneId.of("America/Lima");
    /** Límites que reemplazan a "sin fecha"; así la consulta nunca recibe un instante nulo. */
    private static final Instant NO_LOWER_LIMIT = Instant.EPOCH;
    private static final Instant NO_UPPER_LIMIT = Instant.parse("9999-12-31T00:00:00Z");

    private final LoanRepository loanRepository;
    private final LoanMapper loanMapper;
    private final UserService userService;
    private final ItemService itemService;
    private final Clock clock;

    /**
     * Historial de préstamos de un usuario. {@code from} y {@code to} (hora de Lima, inclusive) y {@code status} son
     * opcionales. Lanza NotFoundException si el usuario no existe y BusinessException si {@code from} es posterior
     * a {@code to}.
     */
    @Transactional(readOnly = true)
    public LoanHistoryReport userHistory(Long userId, LocalDate from, LocalDate to, LoanStatus status,
                                         Pageable pageable) {
        UserResponse user = userService.findById(userId);
        ReportSubject subject = new ReportSubject(user.id(), user.firstName() + " " + user.lastName(),
                user.email() + " · " + user.documentNumber());
        return buildReport(subject, user.id(), null, from, to, status, pageable);
    }

    /**
     * Historial de préstamos de un ítem, con los mismos filtros que el del usuario. Lanza NotFoundException si el
     * ítem no existe.
     */
    @Transactional(readOnly = true)
    public LoanHistoryReport itemHistory(Long itemId, LocalDate from, LocalDate to, LoanStatus status,
                                         Pageable pageable) {
        ItemResponse item = itemService.findById(itemId);
        ReportSubject subject = new ReportSubject(item.id(), item.code() + " · " + item.name(),
                item.category().name());
        return buildReport(subject, null, item.id(), from, to, status, pageable);
    }

    private LoanHistoryReport buildReport(ReportSubject subject, Long userId, Long itemId, LocalDate from,
                                          LocalDate to, LoanStatus status, Pageable pageable) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new BusinessException("La fecha inicial no puede ser posterior a la fecha final");
        }
        Instant now = Instant.now(clock);
        Instant fromAt = from == null ? NO_LOWER_LIMIT : from.atStartOfDay(LIMA).toInstant();
        Instant toAt = to == null ? NO_UPPER_LIMIT : to.plusDays(1).atStartOfDay(LIMA).toInstant();
        Boolean returned = status == null ? null : status == LoanStatus.RETURNED;
        Boolean overdue = status == null || status == LoanStatus.RETURNED ? null : status == LoanStatus.OVERDUE;

        LoanHistoryCounts counts = loanRepository.historyCounts(userId, itemId, fromAt, toAt, now);
        PageResponse<LoanResponse> loans = PageResponse.from(
                loanRepository.history(userId, itemId, fromAt, toAt, returned, overdue, now, pageable)
                        .map(loan -> loanMapper.toResponse(loan, now)));
        LoanHistorySummary summary = new LoanHistorySummary(counts.getTotalLoans(), counts.getActiveLoans(),
                counts.getOverdueLoans(), counts.getReturnedLoans(), counts.getLateReturns(),
                counts.getNormalReturns(), counts.getDamagedReturns(), counts.getLostReturns());
        return new LoanHistoryReport(subject, from, to, now, summary, loans);
    }
}
